module.exports = class QueryFeatures {
  constructor(reqQuery, dbQuery) {
    this.reqQuery = reqQuery;
    this.dbQuery = dbQuery;
  }

  filter() {
    let reqQuery = { ...this.reqQuery };

    // 1) Excluding unrelated params
    for (const param in reqQuery) {
      if (['fields', 'limit', 'sort', 'page'].includes(param)) {
        delete reqQuery[param];
      }
    }

    // 2) Adding $ to operators
    const reqQueryStr = JSON.stringify(reqQuery).replace(
      /(gt)|(lt)|(gte)|(lte)/g,
      (substring) => `$${substring}`
    );
    reqQuery = JSON.parse(reqQueryStr);

    // 3) Filtering
    this.dbQuery.find(reqQuery);

    return this;
  }

  project() {
    let { fields } = this.reqQuery;

    if (fields) {
      // replacing ',' with ' ' in the value of fields param
      fields = fields.replace(/,/g, ' ');

      this.dbQuery.select(fields);
    }

    return this;
  }

  sort() {
    let sortStr = '';
    if (this.reqQuery.sort) {
      // replacing ',' with ' ' in the value of sort param
      sortStr = this.reqQuery.sort.replace(/,/g, ' ');
    } else {
      sortStr = 'id';
    }

    this.dbQuery.sort(sortStr);

    return this;
  }

  paginate() {
    const limit = this.reqQuery.limit * 1 || 9;
    const page = this.reqQuery.page * 1 || 1;

    const skip = limit * (page - 1);

    this.dbQuery.skip(skip).limit(limit);

    return this;
  }
};
