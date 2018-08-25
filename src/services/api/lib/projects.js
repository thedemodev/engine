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
			rmdir(filename)
		} else {
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
				return err
			}

			mkdirSync(projectResult.targetFolder)
			mkdirSync(path.join(projectResult.targetFolder, 'api'))

			Object.assign(ctx.dbsConnection, {[result.name]: ctx.utils.db.sideConnection(ctx.dbsConnection[ctx.CORE_DB], result.name)})

			return `${result.name} successfully created`
		}
		else{
			return `${req.body.name} exist`
		}
	},

	async delete(ctx, req) {
		const projectResult = projectCheck(ctx, req.params.projectId)
		if(projectResult.exist){
			try {
				await ctx.utils.handler.delete(ctx, {
					projectId: ctx.CORE_DB,
					schemaId: 'projects',
					objectKey: req.params.projectId,
					query: req.query
				})
			} catch (err) {
				console.log(err)
				return err
			}

			// DROP DATABASE
			try {
				ctx.dbsConnection[req.params.objectKey].dropDatabase()
				delete ctx.dbsConnection[req.params.objectKey]
				delete ctx.dbs[req.params.objectKey]
			} catch (err) {
				return err
			}

			// REMOVE PROJECT FOLDER
			try {
				await rmdir(projectResult.targetFolder)	
			} catch (err) {
				return err
			}

			return `${req.params.objectKey} successfully deleted`
		}
		else{
			return `${req.params.objectKey} not exist`
		}
	}
}