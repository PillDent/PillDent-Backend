import express from 'express';

import generalRouter from './app/routes/general.routes.js';
import authRouter from './app/routes/auth.routes.js';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter);
app.use(generalRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
