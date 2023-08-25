import express from 'express';

import generalRouter from './app/routes/general.routes.js';
import authRouter from './app/routes/auth.routes.js';
import pillRouter from './app/routes/pill.routes.js';
import userRouter from './app/routes/users.routes.js';
import scheduleRouter from './app/routes/schedule.routes.js';

const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(pillRouter);
app.use(scheduleRouter);
app.use(authRouter);
app.use(userRouter);
app.use(generalRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
