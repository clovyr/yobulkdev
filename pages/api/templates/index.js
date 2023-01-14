import clientPromise from '../../../lib/mongodb';
import generateSchema from '../../../lib/template-engine';
let ObjectId = require('mongodb').ObjectId;

export default async function fetchTemplateRecords(req, res) {
  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME | 'yobulk');
  switch (req.method) {
    case 'GET':
      let query = {};
      if (req.headers.template_id) {
        query = { _id: ObjectId(req.headers.template_id) };
        try {
          let result = await db.collection('templates').findOne(query);
          res.send(result);
        } catch (err) {
          console.error(err.message);
        }
      } else {
        try {
          let result = await db.collection('templates').find({}).toArray();
          res.send(result);
        } catch (err) {
          console.error(err.message);
          res.status(500).json({ error: 'failed to load data' });
        }
      }
      break;
    case 'POST':
      try {
        let columns = req.body.columns;
        let body = req.body;
        //Make this mongo db based
        let generatedSchema = generateSchema(columns);
        body.schema = generatedSchema;
        body.created_date = new Date();

        let result = await db.collection('templates').insertOne(body);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to create data' });
      }
      break;
    case 'PUT':
      try {
        let columnsData = req.body.columns;
        let data = req.body;
        let generatedSchemaUpdate = generateSchema(columnsData);
        data.schema = generatedSchemaUpdate;
        let result = await db
          .collection('templates')
          .updateOne(
            { _id: ObjectId(req.query.template_id) },
            { $set: data },
            { upsert: false }
          );
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to put data' });
      }
      break;
    case 'DELETE':
      try {
        let result = await db
          .collection('templates')
          .deleteOne({ _id: ObjectId(req.query.template_id) });
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to delete data' });
      }
      break;
  }
}
