import { changePasswordInput, inviteMemberInput, loginInput, switchTenantInput, uuid } from '@platform/contracts';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { parse } from '../../../shared/http/validate.js';
import type { IssuedSession } from '../application/session-issuer.js';
import type {
  AddMember,
  ChangePassword,
  GetSessionUser,
  ListMembers,
  Login,
  Logout,
  RefreshSession,
  RemoveMember,
  SwitchTenant,
} from '../application/use-cases.js';

export interface IdentityUseCases {
  login: Login;
  refresh: RefreshSession;
  logout: Logout;
  switchTenant: SwitchTenant;
  me: GetSessionUser;
  changePassword: ChangePassword;
  listMembers: ListMembers;
  addMember: AddMember;
  removeMember: RemoveMember;
}

const REFRESH_COOKIE = 'rt';

export function identityRoutes(uc: IdentityUseCases, opts: { secureCookies: boolean }) {
  const sendSession = (reply: FastifyReply, issued: IssuedSession) => {
    reply.setCookie(REFRESH_COOKIE, issued.refreshToken, {
      httpOnly: true,
      secure: opts.secureCookies,
      sameSite: 'lax',
      path: '/',
      expires: issued.refreshExpiresAt,
    });
    return issued.session;
  };

  return async (app: FastifyInstance) => {
    app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) =>
      sendSession(reply, await uc.login.execute(parse(loginInput, req.body))),
    );

    app.post('/auth/refresh', async (req, reply) => {
      const body = parse(z.object({ tenantId: uuid.optional() }).default({}), req.body ?? {});
      return sendSession(reply, await uc.refresh.execute(req.cookies[REFRESH_COOKIE], body.tenantId));
    });

    app.post('/auth/logout', async (req, reply) => {
      await uc.logout.execute(req.cookies[REFRESH_COOKIE]);
      reply.clearCookie(REFRESH_COOKIE, { path: '/' });
      return reply.status(204).send();
    });

    app.post('/auth/switch-tenant', async (req, reply) => {
      const { tenantId } = parse(switchTenantInput, req.body);
      return sendSession(reply, await uc.switchTenant.execute(requireActor(req), tenantId));
    });

    app.get('/auth/me', async req => uc.me.execute(requireActor(req)));

    app.post('/auth/password', async (req, reply) => {
      const input = parse(changePasswordInput, req.body);
      await uc.changePassword.execute(requireActor(req), input.currentPassword, input.newPassword);
      return reply.status(204).send();
    });

    app.get('/workspace/members', async req => uc.listMembers.execute(requireActor(req)));

    app.post('/workspace/members', async (req, reply) => {
      await uc.addMember.execute(requireActor(req), parse(inviteMemberInput, req.body));
      return reply.status(201).send({ ok: true });
    });

    app.delete('/workspace/members/:userId', async (req, reply) => {
      const { userId } = parse(z.object({ userId: uuid }), req.params);
      await uc.removeMember.execute(requireActor(req), userId);
      return reply.status(204).send();
    });
  };
}
