import path from 'path'
import fs, { mkdirSync } from 'fs'

const rmdir = function(dir) {
	var list = fs.readdirSync(dir)
	for(var i = 0; i < list.length; i++) {
		var filename = path.join(dir, list[i])
		var stat = fs.statSync(filename)
		
		if(filename == '.' || filename == '..') {
			// pass these files
		} else if(stat.isDirectory()) {
			// rmdir recursively
			rmdir(filename)
		} else {
			// rm fiilename
			fs.unlinkSync(filename)
		}
	}
	fs.rmdirSync(dir)
}

const projectCheck = (ctx, projectId) => {
	const targetFolder = path.join(ctx.USERS_PROJECTS, projectId.toLowerCase())
	return fs.existsSync(targetFolder) ? {
		exist: true,
		targetFolder: targetFolder
	} : {
		exist: false,
		targetFolder: targetFolder
	}
}

module.exports = {
	async add(ctx, req) {
		const user = await ctx.utils.auth.verify(req)
		req.body.owner = user._id
		
		// makefolder
		const projectResult = projectCheck(ctx, req.body.name)
		if(!projectResult.exist){
			let result
			try {
				result = await ctx.utils.handler.insert(ctx, {
					projectId: ctx.CORE_DB,
					schemaId: 'projects',
					body: req.body,
					query: req.query
				})
			} catch (err) {
				return {
					code: 400,
					message: err
				}
			}

			mkdirSync(projectResult.targetFolder)
			mkdirSync(path.join(projectResult.targetFolder, 'api'))

			Object.assign(ctx.dbsConnection, {[result.data.name]: ctx.utils.db.sideConnection(ctx.dbsConnection[ctx.CORE_DB], result.data.name)})
			// await ctx.utils.schema.update(ctx, result.data.name)

			return {
				code: 201,
				data: `${req.body.name} successfully created`
			}
		}
		else{
			return {
				code: 400,
				message: `${req.body.name} exist`
			}
		}
	},

	async delete(ctx, req) {
		const user = await ctx.utils.auth.verify(req)
		req.body.owner = user._id

		// removefolder
		const projectResult = projectCheck(ctx, req.params.objectId)
		if(projectResult.exist){
			try {
				await ctx.utils.handler.delete(ctx, {
					projectId: ctx.CORE_DB,
					schemaId: 'projects',
					objectId: req.params.objectId,
					query: req.query
				})
			} catch (err) {
				return {
					code: 400,
					message: err
				}
			}

			await rmdir(projectResult.targetFolder)

			return {
				code: 201,
				data: `${req.params.objectId} successfully deleted`
			}
		}
		else{
			return {
				code: 400,
				message: `${req.params.objectId} not exist`
			}
		}
	}
}