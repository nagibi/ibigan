const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AS|DISTINCT|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX|CAST|COALESCE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|WITH|ASC|DESC)\b/gi;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightSql(code: string): string {
  const escaped = escapeHtml(code);
  const placeholders: string[] = [];

  const withTokens = escaped
    .replace(/(--[^\n]*)/g, (match) => {
      const token = `__COMMENT_${placeholders.length}__`;
      placeholders.push(`<span class="sql-comment">${match}</span>`);
      return token;
    })
    .replace(/('(?:''|[^'])*')/g, (match) => {
      const token = `__STRING_${placeholders.length}__`;
      placeholders.push(`<span class="sql-string">${match}</span>`);
      return token;
    })
    .replace(/(:[a-zA-Z_][\w]*)/g, (match) => {
      const token = `__PARAM_${placeholders.length}__`;
      placeholders.push(`<span class="sql-param">${match}</span>`);
      return token;
    })
    .replace(SQL_KEYWORDS, (match) => `<span class="sql-keyword">${match}</span>`);

  return placeholders.reduce(
    (result, replacement, index) =>
      result
        .replace(`__COMMENT_${index}__`, replacement)
        .replace(`__STRING_${index}__`, replacement)
        .replace(`__PARAM_${index}__`, replacement),
    withTokens,
  );
}
