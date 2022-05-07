// Generate INSERT sql queries based on key => value, as a prepared statement for postgres
// This means generating insert with mapped values for safety ($1, $2)
// Provide mapping like: {key: value, ...}
// USAGE: SqlInsertGenerator({key: value})
// @returns {text: "INSERT INTO table (...) VALUES ($1, $2...)", values: ['one', 'two']}

export class SqlInsertGenerator {
  constructor(table, data) {
    if (!table) throw('Expected table name');
    if (!data) throw ('Expected valid Object with key=>val');

    var keys = Object.keys(data);
    var values = Object.values(data);
    var valuesList = [];
    
    for (let i=1; i<=keys.length; i++) {
      valuesList.push(`$${i}`);
    }

    // Construct insert query
    var q = `INSERT INTO "${table}" ("` + Object.keys(data).join('", "') + `") VALUES (` + valuesList.join(', ') + `) RETURNING *`;

    // Return expected data structure, to be used as a pg execution statement
    return { text: q, values: values }
  }
}

export class BatchSqlUpdateGenerator {
  constructor(table, data) {
    if (!table) throw('Expected table name');
    if (!data) throw ('Expected valid Object with key=>val');

    let results = [];
    data.forEach(element => {
      results.push(`UPDATE "${table}" SET "parentStructureId"=${element.parentStructureId} WHERE id=${element.id}`);
    });

    // Return expected data structure, to be used as a pg execution statement
    return { text: results.join(';') };
  }
}