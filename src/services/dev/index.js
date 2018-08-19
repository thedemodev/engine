import express from 'express'

import schemas from './lib/schemas'

module.exports = {
	router(ctx) {
		const myRouter = express.Router()

		myRouter.use('/projects/:projectId/schemas', schemas(ctx))

		myRouter.get('/projects/:projectId/roles', async (req, res) => {
			try {
				res.json('hehe')
			} catch (err) {
				res.json(err)
			}
		})

		return myRouter
	}
}