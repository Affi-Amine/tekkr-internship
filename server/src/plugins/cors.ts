import fp from "fastify-plugin";
import fastifyCors, {FastifyCorsOptions} from "@fastify/cors";

export default fp<FastifyCorsOptions>(async (fastify) => {
  fastify.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
})
