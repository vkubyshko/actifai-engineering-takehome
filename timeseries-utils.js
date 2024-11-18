const salesByGroup = `
FROM user_groups
LEFT JOIN users ON user_groups.user_id = users.id
LEFT JOIN sales ON sales.user_id = users.id
LEFT JOIN groups ON user_groups.group_id = groups.id
`;
const salesByUser = `
FROM sales
LEFT JOIN users ON sales.user_id = users.id
`;

const selectYear = `EXTRACT(year FROM date) AS year`;
const selectMonth = `CASE
    WHEN EXTRACT(month FROM date) = 1 THEN 'January'
    WHEN EXTRACT(month FROM date) = 2 THEN 'February'
    WHEN EXTRACT(month FROM date) = 3 THEN 'March'
    WHEN EXTRACT(month FROM date) = 4 THEN 'April'
    WHEN EXTRACT(month FROM date) = 5 THEN 'May'
    WHEN EXTRACT(month FROM date) = 6 THEN 'June'
    WHEN EXTRACT(month FROM date) = 7 THEN 'July'
    WHEN EXTRACT(month FROM date) = 8 THEN 'August'
    WHEN EXTRACT(month FROM date) = 9 THEN 'September'
    WHEN EXTRACT(month FROM date) = 10 THEN 'October'
    WHEN EXTRACT(month FROM date) = 11 THEN 'November'
    WHEN EXTRACT(month FROM date) = 12 THEN 'December'
END AS month, EXTRACT(month FROM date) as month_id`;
const selectDOW = `CASE 
    WHEN EXTRACT(DOW FROM date) = 0 THEN 'Sunday'
    WHEN EXTRACT(DOW FROM date) = 1 THEN 'Monday'
    WHEN EXTRACT(DOW FROM date) = 2 THEN 'Tuesday'
    WHEN EXTRACT(DOW FROM date) = 3 THEN 'Wednesday'
    WHEN EXTRACT(DOW FROM date) = 4 THEN 'Thursday'
    WHEN EXTRACT(DOW FROM date) = 5 THEN 'Friday'
    WHEN EXTRACT(DOW FROM date) = 6 THEN 'Saturday'
END AS day_of_week, EXTRACT(DOW FROM date) as dow_id`;

const validationRules = {
    partitionByDay: 'required|boolean',
    partitionByMonth: 'required|boolean',
    partitionByYear: 'required|boolean',
    partitionByDayOfWeek: 'boolean',
    partitionByType: 'required|string|in:user,group,role,none',
    groupId: 'integer',
    userId: 'integer',
    startDate: 'date',
    endDate: 'date',
    calculation: 'required|string'
}

const validator = require('validatorjs');

const formatQuery = function(params) {

    const validation = new validator(params, validationRules);
    if (!validation.passes()) throw new Error('Invalid parameters passed into request.')

    const { whereText, values, joinOnGroups } = formatWheres(params);

    const { selections, groupBys, joinText } = formatPartitions(params, joinOnGroups);

    const stat = getStat(params);

    return {
        query: `SELECT ${stat}, ${selections} ${joinText}
        ${whereText}
        GROUP BY ${groupBys}
        ORDER BY ${groupBys}
        `,
        values
    }
}

/**
 * 
 * @param {*} params of req
 * @param joinOnGroups boolean - do we need to join group table no matter what the partitions are
 * @returns table join sql and select sql
 */
const formatPartitions = function(params, joinOnGroups) {
    const selections = [];
    const groupBys = [];
    let joinText;
    const partitionParams = [
        { name: 'partitionByYear', select: selectYear, groupBy: 'year' },
        { name: 'partitionByMonth', select: selectMonth, groupBy: `month_id, month` },
        { name: 'partitionByDayOfWeek', select: selectDOW, groupBy: `dow_id, day_of_week` },
        { name: 'partitionByDay', select: 'date', groupBy: 'date'}
    ]
    partitionParams.forEach((partition) => {
        const paramVal = params[partition.name];
        if (paramVal === 'true') {
            selections.push(partition.select);
            groupBys.push(partition.groupBy);
        }
    })
    // if all date partitions were set to false then its not a timeseries
    if (!selections.length) {
        throw new Error('Must have a time partition selected')
    }
    // if keys changed, update validator
    const types = {
        'user': {
            select: `users.id as user_id, users.name as user_name`,
            groupBy: `users.id, users.name`,
            join: salesByUser
        },
        'group': {
            select: `groups.id as group_id, groups.name as group_name`,
            groupBy: `groups.id, groups.name`,
            join: salesByGroup
        },
        'role': {
            select: `role`,
            groupBy: `role`,
            join: salesByUser
        }
    }
    if (params.partitionByType === 'none') {
        joinText = salesByUser;
    } else {
        selections.push(types[params.partitionByType].select);
        groupBys.push(types[params.partitionByType].groupBy);
        joinText = types[params.partitionByType].join;
    }
    // override if querying on a single group_id, we must join the group table
    if (joinOnGroups && params.partitionByType !== 'group') joinText = salesByGroup;
    return { selections: selections.join(', '), groupBys: groupBys.join(', '), joinText };
}

/**
 * 
 * @param {*} params of req
 * @returns where sql text and corresponding values
 */
const formatWheres = function(params) {
    let whereText = '';
    let counter = 1;
    const values = [];
    let joinOnGroups = false;
    const filterParams = [
        {
            name: 'startDate',
            text: 'date >= $counter::date',
            method: formatDate
        },
        {
            name: 'endDate',
            text: 'date <= $counter::date',
            method: formatDate
        },
        {
            name: 'userId',
            text: 'users.id=$counter::int',
        },
        {
            name: 'groupId',
            text: 'group_id=$counter::int'
        }
    ]
    filterParams.forEach((filter) => {
        const paramVal = params[filter.name];
        if (paramVal) {
            whereText += `${whereText ? 'AND ': ''}${filter.text.replace('counter', counter.toString())}\n`;
            const val = filter.method ? filter.method(paramVal) : paramVal;
            values.push(val)
            counter++;
            if (filter.name === 'groupId') joinOnGroups = true;
        }
    });
    return { whereText: whereText ? `WHERE ${whereText}` : '', values, joinOnGroups };
}

const getStat = function(params) {
    const paramStats = params.calculation.split(',');
    const funcs = {
        'average': 'AVG',
        'count': 'COUNT',
        'total': 'SUM',
        'min': 'MIN',
        'max': 'MAX',
    }
    const stats = paramStats.map(stat => funcs[stat.trim()] ? (funcs[stat.trim()] + '(amount)') : null).filter(Boolean);
    return stats.join(', ');
}

const formatDate = function(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

module.exports = {
    formatQuery
}