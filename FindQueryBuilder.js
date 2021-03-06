const FindQueryBuilder = () => {
  const isObjectId = value => {
    if (!value) {
      return false;
    }
    const proto = Object.getPrototypeOf(value);
    if (
      proto == null ||
      proto.constructor == null ||
      proto.constructor.name !== 'ObjectID'
    ) {
      return false;
    }
    return value._bsontype === 'ObjectID';
  };

  const isOnlyObject = obj =>
    typeof obj === 'object' &&
    !(obj instanceof Date) &&
    !Array.isArray(obj) &&
    obj !== null;

  const isArrayObjects = obj =>
    Array.isArray(obj) && obj.length > 0 && isOnlyObject(obj[0]);

  const inModifier = query => {
    return Object.entries(query).reduce((prev, [key, value]) => {
      const updateQuery = {
        ...prev
      };
      if (key !== '!' && Array.isArray(value) && key !== '$or') {
        updateQuery[key] = { $in: value };
      } else if (isOnlyObject(value) && !isObjectId(value)) {
        updateQuery[key] = inModifier(value);
      } else if (isArrayObjects(value)) {
        const res = value.map(x => (isObjectId(x) ? x : inModifier(x)));
        updateQuery[key] = res;
      } else {
        updateQuery[key] = value;
      }
      return updateQuery;
    }, {});
  };

  const notInModifier = query => {
    return Object.entries(query).reduce((prev, [key, value]) => {
      let updateQuery = {
        ...prev
      };
      if (key === '!' && Array.isArray(value)) {
        updateQuery = { $nin: value };
      } else if (isOnlyObject(value) && !isObjectId(value)) {
        updateQuery[key] = notInModifier(value);
      } else if (isArrayObjects(value)) {
        const res = value.map(x => (isObjectId(x) ? x : notInModifier(x)));
        updateQuery[key] = res;
      } else {
        updateQuery[key] = value;
      }
      return updateQuery;
    }, {});
  };

  const criteriaModifiers = query => {
    const criterias = {
      '<': '$lt',
      '<=': '$lte',
      '>': '$gt',
      '>=': '$gte',
      '!=': '$ne',
      '!': '$ne'
    };
    return Object.entries(query).reduce((prev, [key, value]) => {
      const updateQuery = {
        ...prev
      };
      if (criterias[key]) {
        updateQuery[criterias[key]] = value;
      } else if (isOnlyObject(value) && !isObjectId(value)) {
        updateQuery[key] = criteriaModifiers(value);
      } else if (isArrayObjects(value)) {
        const res = value.map(x => (isObjectId(x) ? x : criteriaModifiers(x)));
        updateQuery[key] = res;
      } else {
        updateQuery[key] = value;
      }
      return updateQuery;
    }, {});
  };

  const idModifier = query =>
    Object.entries(query).reduce((prev, [key, value]) => {
      const updateQuery = {
        ...prev
      };
      if (key === 'id') {
        updateQuery._id = value;
      } else if (isOnlyObject(value) && !isObjectId(value)) {
        updateQuery[key] = idModifier(value);
      } else if (isArrayObjects(value)) {
        const res = value.map(x => (isObjectId(x) ? x : idModifier(x)));
        updateQuery[key] = res;
      } else {
        updateQuery[key] = value;
      }
      return updateQuery;
    }, {});

  const buildQuery = waterlineQuery => {
    const { where, or, ...otherFields } = waterlineQuery;

    let query = {
      ...(or && { $or: or }),
      ...otherFields
    };

    if (where) {
      const { id: whereId, or: whereOr, ...restWhere } = where;
      query = {
        ...query,
        ...(restWhere && { ...restWhere }),
        ...(whereId && { _id: whereId }),
        ...(whereOr && { $or: whereOr })
      };
    }

    query = idModifier(query);
    query = inModifier(query);
    query = notInModifier(query);
    query = criteriaModifiers(query);
    return query;
  };

  return {
    buildQuery
  };
};
module.exports = FindQueryBuilder;
