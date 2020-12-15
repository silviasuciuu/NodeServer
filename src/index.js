const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { issue: [{ error: err.message || 'Unexpected error' }] };
    ctx.response.status = 500;
  }
});

class Student {
  constructor({ id, nume, prenume, grupa,active }) {
    this.id = id;
    this.nume = nume;
    this.prenume = prenume;
    this.grupa= grupa;
    this.active= active;

  }
}

const students = [];
for (let i = 0; i < 3; i++) {
  students.push(new Student({ id: `${i}`, nume: `nume ${i}`, prenume:`prenume ${i}`, grupa: 232,active:"false" }));
}
let lastId = students[students.length - 1].id;


const broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

const router = new Router();

router.get('/student', ctx => {
  ctx.response.body = students;
  ctx.response.status = 200;
});



const createStudent = async (ctx) => {
  const student = ctx.request.body;
  if (!student.nume || !student.prenume || !student.grupa || !student.active) { // validation
    ctx.response.body = { issue: [{ error: 'Something is missing' }] };
    ctx.response.status = 400; //  BAD REQUEST
    return;
  }
  student.id = `${parseInt(lastId) + 1}`;
  students.push(student);
  ctx.response.body = student;
  ctx.response.status = 201; // CREATED
  broadcast({ event: 'created', payload: { student } });
};

router.post('/student', async (ctx) => {
  await createStudent(ctx);
});



setInterval(() => {
  lastUpdated = new Date();
  lastId = `${parseInt(lastId) + 1}`;
  const student = new Student({ id: `notif`+lastId, nume: `nume ${lastId}`, prenume: `prenume ${lastId}`,grupa:"232",active:"false" });
  students.push(student);

  broadcast({ event: 'created', payload: { student} });
}, 15000);

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000);
