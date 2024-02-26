import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import tiktokRoutes from './src/routes/tiktok-routes.js'
import linkedinRoutes from './src/routes/linkedin-routes.js'
import instagramRoutes from './src/routes/instagram-routes.js'
import facebookRoutes from './src/routes/facebook-routes.js'
import userRoutes from './src/routes/user-routes.js'
// import postRoutes from './src/routes/post-routes.js'

const app = express();
dotenv.config()
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(bodyParser.json())


app.use('/linkedin', linkedinRoutes)
app.use('/facebook', facebookRoutes)
app.use('/instagram', instagramRoutes)
app.use('/tiktok', tiktokRoutes)
// app.use("/post", postRoutes);
app.use("/user", userRoutes);


app.get('/', (req, res) => {
  res.send(`
    linkedinRoutes: '/linkedin',
    --
    facebookRoutes: '/facebook',
    --
    instagramRoutes: '/instagram',
    --
    tiktokRoutes: '/tiktok',
    `)
})

mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() =>

    console.log("<<<<<<-------MONGODB CONNECTED AND MONGOD RUNNING------->>>>>")
  )
  .catch((err) => console.log('-----', err.message, process.env.MONGODB_URI));

app.listen(8000, () => {
  console.log("🚀 ~ app.listen ~ listening on port:", 8000)
}
)
