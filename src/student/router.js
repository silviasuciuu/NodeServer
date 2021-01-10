import Router from 'koa-router';
import studentStore from './store';
import {broadcast} from "../utils";

export const router = new Router();

router.get('/', async (ctx) => {
    const response = ctx.response;
    const grupa = ctx.state.user.grupa;
    response.body = await studentStore.find({grupa});
    response.status = 200; // ok


});
router.get('/:id', async (ctx) => {
    const userId = ctx.state.user._id;
    const grupa = ctx.state.user.grupa;

    const st = await studentStore.findOne({_id: ctx.params.id});
    const response = ctx.response;
    if (st) {
        if (st.grupa === grupa) {
            response.body = st;
            response.status = 200; // ok
        } else {
            response.status = 403; // forbidden
        }
    } else {
        response.status = 404; // not found
    }
});

router.put('/:id', async (ctx) => {
    const st = ctx.request.body;
    const id = ctx.params.id;
    const stId = st._id;
    const response = ctx.response;
    if (stId && stId !== id) {
        response.body = { message: 'Param id and body _id should be the same' };
        response.status = 400; // bad request
        return;
    }
    if (!stId) {
        await createStudent(ctx, st, response);
    } else {
        const userId = ctx.state.user._id;
        st.userId = userId;
        st.grupa=ctx.state.user.grupa;
        st.active="false";

        const updatedCount = await studentStore.update({ _id: id }, st);
        if (updatedCount === 1) {
            response.body =st;
            response.status = 200; // ok
            broadcast(userId, { type: 'updated', payload: st });
        } else {
            response.body = { message: 'Resource no longer exists' };
            response.status = 405; // method not allowed
        }
    }
});

const createStudent = async (ctx, student, response) => {
    try {

        console.log(ctx.request.body)
        const grupa = ctx.state.user.grupa;
        student.grupa = grupa;
        student.active = "false";
        response.body = await studentStore.insert(student);

        response.status = 201; // created
        broadcast(grupa, {type: 'created', payload: student});
    } catch (err) {
        response.body = {message: err.message};
        response.status = 400; // bad request
    }
};
router.post('/', async ctx => {
    await createStudent(ctx, ctx.request.body, ctx.response)
})
;

router.post('/signup', async ctx => {
    await createStudent(ctx, ctx.request.body, ctx.response)
});


