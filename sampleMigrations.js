async getEcosCmpsAndRevisionsDetails(list) {
	for (const _id of list) {
		const applyQuery = async ([
			type, collection, query, select = null
		]) => await this.store[collection].model[type](query).select(select).lean().exec();
		let {
			con, name, approverList,
			childRevision: { componentRevision },
			children: { components }
		} = await applyQuery(['findById', 'changeOrders', _id, 'name con children childRevision approverList']);
		const getData = Object.freeze({
			components: ['find', 'components', { _id: { $in: components } }, 'cpn documents revision status'],
			componentRevisions: ['find', 'componentRevisions', { _id: { $in: componentRevision } }, 'cpn documents creator revision status']
		});
		console.log('\nApproverList', approverList)
		console.log('\n       ECO                      CON            NAME ')
		console.log(`${_id}  ,  ${con}  ,  ${name}`);
		let [cmps, cmpRevs] = await Promise.all(Object.keys(getData).map(el => applyQuery(getData[el])))
		console.log('\n       COMPONENTS               cpn    revision   status   documents')
		cmps.forEach(({
			_id, cpn, documents, revision, status
		}) => console.log(`${_id} -=> ${cpn} -=> ${revision} -=> ${status} -=> ${documents.length}`))
		console.log('\n   COMPONENT REVISIONS         cpn               creator           revision    status   documents')
		cmpRevs.forEach(({
			_id, cpn, documents, revision, status, creator
		}) => console.log(`${_id} -=> ${cpn} -=> ${creator} -=> ${revision} -=> ${status} -=> ${documents.length}`))
		console.log('\n\n')
	}
}



async getEffectedEcos(company) {
	const applyQuery = async ([
		type, collection, query, select = null
	]) => await this.store[collection].model[type](query).select(select).lean().exec();

	let list = await applyQuery(['find', 'changeOrders', { company }, 'children childRevision con name'])
	console.log(list.length);

	list.forEach(async ({
		con, name, children: { components }, childRevision: { componentRevision }
	}) => {
		if (componentRevision.length > components.length) {
			let cmps = await applyQuery(['find', 'components', { _id: { $in: components } }, 'cpn'])
			cmps = cmps.map(({ cpn }) => cpn);
			console.log(`${con} , ${name} , [ ${cmps} ]`);
		}
	})
}




async removeComponentRevisions(list, trueDelete = false) {
	const filter = from => from.filter(el => !list.includes(String(el.assemblyRevision ? el.assemblyRevision : el)));
	const applyQuery = async ([
		type, collection, query, select = null, update = null
	]) => await this.store[collection].model[type](query, update).select(select).lean().exec();

	const dataToFilter = {
		cmp: {
			get: ['find', 'components', { revisions: { $in: list } }, 'revisions'],
			set: ({ _id, revisions }) => ['update', 'components', { _id }, null, { $set: { revisions: filter(revisions) } }],
			data: []
		},
		cmpRevisions: {
			get: ['find', 'componentRevisions', { revisions: { $in: list } }, 'revisions'],
			set: ({ _id, revisions }) => ['update', 'componentRevisions', { _id }, null, { $set: { revisions: filter(revisions) } }],
			data: []
		},
		cmpSubRevisions: {
			get: ['find', 'componentRevisions', { subRevisions: { $in: list } }, 'subRevisions'],
			set: ({ _id, subRevisions }) => ['update', 'componentRevisions', { _id }, null, { $set: { subRevisions: filter(subRevisions) } }],
			data: []
		},
		cmpChildren: {
			get: ['find', 'components', { "children.assemblyRevision": { $in: list } }, 'children'],
			set: ({ _id, children }) => ['update', 'components', { _id }, null, { $set: { subRevisions: filter(children) } }],
			data: []
		},
		cmpRevChildren: {
			get: ['find', 'componentRevisions', { "children.assemblyRevision": { $in: list } }, 'children'],
			set: ({ _id, children }) => ['update', 'componentRevisions', { _id }, null, { $set: { children: filter(children) } }],
			data: []
		},
		prd: {
			get: ['find', 'products', { "children.assemblyRevision": { $in: list } }, 'children'],
			set: ({ _id, children }) => ['update', 'products', { _id }, null, { $set: { children: filter(children) } }],
			data: []
		},
		prdRevisions: {
			get: ['find', 'productRevisions', { "children.assemblyRevision": { $in: list } }, 'children'],
			set: ({ _id, children }) => ['update', 'productRevisions', { _id }, null, { $set: { 'children': filter(children) } }],
			data: []
		},
		co: {
			get: ['find', 'changeOrders', { 'childRevision.componentRevision': { $in: list } }, 'childRevision'],
			set: ({ _id, childRevision: { componentRevision } }) => ['update', 'changeOrders', { _id }, null, { $set: { 'childRevision.componentRevision': filter(componentRevision) } }],
			data: []
		}
	};

	await Promise.all(
		Object.keys(dataToFilter).map(el => applyQuery(dataToFilter[el]['get'])
			.then(res => dataToFilter[el].data = res)
		));
	console.log('----dataToFilter----', dataToFilter)

	await Promise.all(
		Object.keys(dataToFilter).map(el => {
			let { data } = dataToFilter[el];
			data.length && data.forEach(item =>
				applyQuery(dataToFilter[el]['set'](item))
			);
		})
	).then(list.forEach(async _id => {
		trueDelete
			? await this.app.modules.store.connection.db.collection('componentRevisions')
				.deleteOne({ _id: mongoose.Types.ObjectId(_id) }, null)
			: await applyQuery(['update', 'componentRevisions', { _id }, null, { $set: { archived: true } }])
	}))
}




async copyDocumentsFromComponentToLatestRevision() {
	const idz = [
		"635099b59820ce000942b7ab",
		"63509af6e7b0f10009ced62b",
		"63509af74885c50009eb8e2c"
	]

	for (let _id of idz) {
		let { documents, revisions } = await this.store.components.model.findById({ _id }).lean().exec();
		console.log('------documents-=> ', documents);
		console.log('------revisions.length-=> ', revisions[revisions.length - 1]);
		await this.store.componentRevisions.model.update({ _id: revisions[revisions.length - 1] }, { $set: { documents } }).lean().exec();
	}
}

async removeRevisionsFromCo(list, coId) {
	const Actions = {
		componentRevision: async () =>
			await this.store.changeOrders.model.findById(coId).select('childRevision').lean().exec(),
		revisions: async () =>
			await getActionItems['find']('components', { revisions: { $in: list } }, 'revisions'),
		cmpRevisions: async () =>
			await getActionItems['find']('componentRevisions', { revisions: { $in: list } }, 'revisions'),
		subRevisions: async () =>
			await getActionItems['find']('componentRevisions', { subRevisions: { $in: list } }, 'subRevisions'),
	}
	const getActionItems = {
		revisions: ({ revisions }) =>
			['components', { $set: { revisions: filter(revisions) } }],
		subRevisions: ({ subRevisions }) =>
			['componentRevisions', { $set: { subRevisions: filter(subRevisions) } }],
		find: async (collection, query, select) =>
			await this.store[collection].model.find(query).select(select).lean().exec(),
	}

	const filter = from => from.filter(el => !list.includes(String(el)))
	let [
		{ childRevision: { componentRevision } },
		revisions,
		cmpRevisions,
		subRevisions
	] = await Promise.all(Object.keys(Actions).map(el => Actions[el]()))

	const update = async () => {
		[...revisions, ...subRevisions].forEach(async el => {
			const [, detail] = Object.keys(el);
			const [collection, set] = getActionItems[detail](el);
			await this.store[collection].model.update({ _id: el._id }, set).lean().exec()
		});
		cmpRevisions.forEach(async el => {
			const [, detail] = Object.keys(el);
			const [, set] = getActionItems[detail](el);
			await this.store.componentRevisions.model.update({ _id: el._id }, set).lean().exec()
		})
	};

	await Promise.all([
		this.store.changeOrders.model.update({ _id: coId },
			{ $set: { 'childRevision.componentRevision': filter(componentRevision) } }).lean().exec(),
		update()
	]).then(list.forEach(async _id =>
		await this.store.componentRevisions.model.update({ _id }, { $set: { archived: true } }).lean().exec() //Soft Delete
	))
}





async loadSpecificComponentToLocal(
	env = "local", condition, infoObj = {//Default values are for Duro Demo
		company: "test",
		creator: "test",
		library: "test"
	}) {
	console.log(' << :::::::::::::::::::::: START :::::::::::::::::::::: >>');
	const getDbConfig = Object.freeze({
		qa: { clusterUrl: 'qa', dbName: 'plm-qa' },
		local: { clusterUrl: 'default', dbName: 'test' },
		demo: { clusterUrl: 'demoV1', dbName: 'plm-demo' },
		staging: { clusterUrl: 'staging', dbName: 'plm-staging' },
	})

	const client = await MongoClient.connect(
		this.uris.remote[getDbConfig[env]['clusterUrl']]);
	const db = client.db(getDbConfig[env]['dbName']);

	const clientLocal = await MongoClient.connect(
		this.uris.local[getDbConfig['local']['clusterUrl']]);
	const dbLocal = clientLocal.db(getDbConfig['local']['dbName']);

	const KeysToFilter = ['images', 'documents', 'children']
	const ActionsToPerform = {
		update: a => Object.keys(infoObj).forEach(el =>
			a[el] = mongoose.Types.ObjectId(infoObj[el])),
		clean: a => KeysToFilter.forEach(el => a[el] = []),
	}

	const Update = item =>
		Object.keys(ActionsToPerform).forEach(el => ActionsToPerform[el](item));

	await db.collection('components').find(condition).toArray()
		.then(async cmp => {
			for (let item of cmp) {
				Update(item)
				let [, revs] = await Promise.all([
					dbLocal.collection('components').insertMany([item], { ordered: false }),
					db.collection('componentRevisions').find({ parent: item._id }).toArray()
				])
				let count = 0;
				console.log('----> revs ', revs.length)
				for (let rev of revs) {
					console.log('----> rev ', ++count)
					Update(rev);
					await dbLocal.collection('componentRevisions').insertMany([rev], { ordered: false });
				}
			}
		})
	console.log(' << :::::::::::::::::::::: END :::::::::::::::::::::: >>');
}