# Enterprise User Service Security Checklist

## 1. Authentication & Authorization
- [ ] **JWT Validation**: Verify `exp`, `iat`, `iss`, and `aud` claims on every request.
- [ ] **Token Revocation**: Implement `token_version` check in `users` table to allow global logout.
- [ ] **Scope Enforcement**: Ensure User Service only accepts tokens with `user:read` or `user:write` scopes.
- [ ] **MFA**: Enforce MFA for sensitive operations like `Username Change` or `Security Settings Update`.

## 2. Data Protection
- [ ] **Encryption at Rest**: AWS RDS (Aurora) AES-256 encryption.
- [ ] **Encryption in Transit**: TLS 1.3 for all public traffic; mTLS for internal service-to-service communication.
- [ ] **PII Redaction**: Data scrubbing in logs for Email/IP Address/Username.
- [ ] **Field Masking**: Private email/phone should never be returned in the `Public Profile` response.

## 3. Infrastructure Security
- [ ] **VPC Isolation**: Database and Redis must be in isolated private subnets.
- [ ] **Security Groups**: Only allow ingress from the EKS Node groups.
- [ ] **WAF**: AWS WAF rules to block common SQLi, XSS, and DDoS patterns.
- [ ] **Secrets Management**: No hardcoded credentials. Use AWS Secrets Manager or HashiCorp Vault.

## 4. API Resilience
- [ ] **Rate Limiting**: Distributed rate limiting using Redis (Leaky Bucket / Fixed Window).
- [ ] **Input Validation**: Use Zod/JsonSchema for strict type checking on all inputs.
- [ ] **Circuit Breakers**: Prevent cascading failure if DB or Redis is slow.
- [ ] **Timeout Management**: Strict timeouts (100ms for L2 Cache, 500ms for DB).

## 5. Compliance
- [ ] **GDPR Right to Erasure**: Service must trigger a deletion workflow that purges data across all microservices (Feed, Chat, Notif).
- [ ] **Audit Logging**: Immutable record of every "Write" operation with ActorID and Metadata.
- [ ] **Data Locality**: Logical or physical partitioning of data based on user region.
