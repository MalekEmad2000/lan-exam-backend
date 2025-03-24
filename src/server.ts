import express from 'express';
import cors from 'cors';
import routes from './routes';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// make all time to be in Egypt time zone
process.env.TZ = 'Africa/Cairo';
const app = express();
// adidng cors middleware
app.use(cors());

// adding body parser middleware
app.use(express.json({ limit: '5mb' }));

app.use('/api', routes);

app.use(express.static(path.join(__dirname, 'Frontend')));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

const PORT = (process.env.PORT as unknown as number) || 3030;

app.listen(PORT,() => {
  console.log(`Prof. Backend app listening at http://localhost:${PORT}`);
});

export default app;
