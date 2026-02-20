import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import type { RegisterInput, LoginInput, RefreshTokenInput, Verify2FAInput, Verify2FALoginInput } from "./auth.schema.js";
import { AppError } from "../../utils/AppError.js";

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  registerHandler = async (
    request: FastifyRequest<{ Body: RegisterInput }>,
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
    request: FastifyRequest<{ Body: LoginInput }>,
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
