import { PrismaClient } from '../generated/prisma/edge'
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign, verify} from "hono/jwt";
import { createPostInput, updatePostInput } from "@pranavpn/common"


export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
    Variables: {
        userId: string;
    }
}>();

blogRouter.use('/*',  async (c, next) => {
    try {
        const jwt = c.req.header('Authorization');
        if (!jwt) {
            c.status(401);
            return c.json({ error: "unauthorized" });
        }
        const token = jwt.split(' ')[1];
          
        const payload = await verify(token, c.env.JWT_SECRET);
        if (!payload) {
            c.status(401);
            return c.json({ error: "unauthorized" });
        }
        c.set('userId', String(payload.id)); 
        await next()
    } catch (error) {
        c.status(401);
        return c.json({ error: "unauthorized", details: "Invalid token" });
    }
})

blogRouter.post('/', async (c) => {                  //create a blog post
    try {
        const userId = c.get('userId');
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate());
        const body = await c.req.json();
        const { success } = createPostInput.safeParse(body);
	if (!success) {
		c.status(400);
		return c.json({ error: "invalid input" });
	}
        
        const blog = await prisma.post.create({
            data:{
                title: body.title,
                content: body.content,
                published: body.published === "true" || body.published === true,
                authorId: userId
            }
        })
        return c.json({ id: blog.id });
    } catch (error) {
        c.status(500);
        return c.json({ 
            error: "Failed to create blog post", 
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
})

blogRouter.put('/', async (c) => {//update a blog post
    const userId = c.get('userId');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = updatePostInput.safeParse(body);
	if (!success) {
		c.status(400);
		return c.json({ error: "invalid input" });
	}

    const blog = await prisma.post.update({
        where: {
            id: body.id,
            authorId: userId
        },
        data: {
            title: body.title,
            content: body.content,
            published: body.published
        }
    });
    return c.json(blog.id);
})       

blogRouter.get('/bulk', async (c) => { //get all blog posts
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blogs = await prisma.post.findMany({})
    return c.json(blogs);
})

blogRouter.get('/:id', async (c) =>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param('id');
    const blog = await prisma.post.findUnique({
        where: {
            id: id
        }
    });
    if (!blog) {
        c.status(404);
        return c.json({ error: "blog not found" });
    }
    return c.json(blog);
})    
