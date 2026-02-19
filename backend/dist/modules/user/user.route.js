import * as controller from './user.controller.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
export default async function userRoutes(fastify) {
    fastify.post('/', { schema: createUserSchema }, controller.createUserHandler);
    fastify.get('/', controller.getUsersHandler);
    fastify.get('/:id', controller.getUserHandler);
    fastify.put('/:id', { schema: updateUserSchema }, controller.updateUserHandler);
    fastify.delete('/:id', controller.deleteUserHandler);
}
//# sourceMappingURL=user.route.js.map