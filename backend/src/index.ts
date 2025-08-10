import { Hono } from 'hono'
import { PrismaClient } from './generated/prisma/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign,verify } from 'hono/jwt'
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';



// Create the main Hono app
const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	}	
	Variables : {
		userId: string
	}
}>;

//to see //doubt 
// app.use('*', (c) => {
// 	const prisma = new PrismaClient({
//       datasourceUrl: c.env.DATABASE_URL,
//   }).$extends(withAccelerate());
//   c.set(”prisma”, prisma);
// })

// all the user routes 
app.route('/api/v1/user', userRouter) 
app.route('/api/v1/blog',blogRouter)

export default app
