import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import type { RegisterDto, LoginDto, ChangePasswordDto } from "./auth.dto.js";
import type { Verify2FAInput, Verify2FALoginInput } from "./auth.schema.js";
import { AppError } from "../../utils/AppError.js";

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  registerHandler = async (
    request: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply
  ) => {
    const meta = {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(request.headers['user-agent'] ? { ua: request.headers['user-agent'] } : {})
    };
    const { user, tokens } = await this.authService.register(request.body, meta);

    this.setRefreshTokenCookie(reply, tokens.refreshToken);

    return reply.status(201).send({
      message: "User registered successfully. check your email for verification.",
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        bio: user.bio,
        website: user.website,
        location: user.location,
        profile: {
          techStack: user.techStack || [],
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
        }
      },
    });
  };

  verifyEmailHandler = async (
    request: FastifyRequest<{ Querystring: { token: string } }>,
    reply: FastifyReply
  ) => {
    const { token } = request.query;
    if (!token) {
      throw new AppError("Verification token missing", 400);
    }
    const result = await this.authService.verifyEmail(token);
    return reply.status(200).send(result);
  };

  loginHandler = async (
    request: FastifyRequest<{ Body: LoginDto }>,
    reply: FastifyReply
  ) => {
    const meta = {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(request.headers['user-agent'] ? { ua: request.headers['user-agent'] } : {})
    };
    const result = await this.authService.login(request.body, meta);

    if (result.mfaRequired) {
      return reply.status(200).send({
        message: "MFA required",
        mfaRequired: true,
        tempToken: result.tempToken,
        userId: result.user.id
      });
    }

    this.setRefreshTokenCookie(reply, result.tokens!.refreshToken);

    return reply.status(200).send({
      message: "Login successful",
      accessToken: result.tokens!.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        username: result.user.username,
        avatarUrl: result.user.avatarUrl,
        coverUrl: result.user.coverUrl,
        bio: result.user.bio,
        website: result.user.website,
        location: result.user.location,
        profile: {
          techStack: result.user.techStack || [],
          followersCount: result.user.followersCount || 0,
          followingCount: result.user.followingCount || 0,
        }
      },
    });
  };

  googleLoginHandler = async (
    request: FastifyRequest<{ Body: { idToken: string, deviceId: string } }>,
    reply: FastifyReply
  ) => {
    const meta = {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(request.headers['user-agent'] ? { ua: request.headers['user-agent'] } : {})
    };
    const { idToken, deviceId } = request.body;
    const { user, tokens } = await this.authService.googleLogin(idToken, deviceId, meta);

    this.setRefreshTokenCookie(reply, tokens.refreshToken);

    return reply.status(200).send({
      message: "Google login successful",
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        bio: user.bio,
        website: user.website,
        location: user.location,
        profile: {
          techStack: user.techStack || [],
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
        }
      }
    });
  };

  setup2FAHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const data = await this.authService.setup2FA(userId);
    return reply.send(data);
  };

  verify2FAHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const body = request.body as Verify2FAInput;
    const result = await this.authService.verify2FA(userId, body.token);
    return reply.send(result);
  };

  verify2FALoginHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const body = request.body as Verify2FALoginInput;
    const meta = {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(request.headers['user-agent'] ? { ua: request.headers['user-agent'] } : {})
    };
    const { user, tokens } = await this.authService.verify2FALogin(
      body.tempToken,
      body.code,
      body.deviceId,
      meta
    );

    this.setRefreshTokenCookie(reply, tokens.refreshToken);

    return reply.status(200).send({
      message: "Login successful",
      accessToken: tokens.accessToken,
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        username: user!.username,
        avatarUrl: user!.avatarUrl,
        coverUrl: user!.coverUrl,
        bio: user!.bio,
        website: user!.website,
        location: user!.location,
        profile: {
          techStack: user!.techStack || [],
          followersCount: user!.followersCount || 0,
          followingCount: user!.followingCount || 0,
        }
      },
    });
  };

  refreshHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const meta = {
      ...(request.ip ? { ip: request.ip } : {}),
      ...(request.headers['user-agent'] ? { ua: request.headers['user-agent'] } : {})
    };
    const tokens = await this.authService.refresh(refreshToken, meta);

    this.setRefreshTokenCookie(reply, tokens.refreshToken);

    return reply.status(200).send({
      accessToken: tokens.accessToken,
    });
  };

  logoutHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      const [sessionId] = refreshToken.split('.');
      if (sessionId) {
        await this.authService.logout(sessionId).catch(() => { }); // Continue even if cleanup fails
      }
    }

    reply.clearCookie("refreshToken");
    return reply.status(200).send({ message: "Logout successful" });
  };

  meHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const user = await this.authService.getMe(userId);
    return reply.status(200).send(user);
  };

  changePasswordHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const body = request.body as ChangePasswordDto;
    await this.authService.changePassword(userId, body);
    return reply.status(200).send({ message: "Password changed successfully" });
  };

  private setRefreshTokenCookie(reply: FastifyReply, token: string) {
    reply.setCookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Lax is more compatible with different ports/ips in dev
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  }
}
