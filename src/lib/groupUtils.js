export function buildGroupMap(groups) {
  const map = {};
  for (const g of groups) map[g.id] = g;
  return map;
}

export function getDescendantIds(groupId, groupMap) {
  const result = new Set([groupId]);
  const queue = [groupId];
  const allGroups = Object.values(groupMap);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const g of allGroups) {
      if (g.parent?.id === current && !result.has(g.id)) {
        result.add(g.id);
        queue.push(g.id);
      }
    }
  }

  return result;
}

export function getSortedGroups(allGroups) {
  const systemIds = new Set([
    "GroupCompanyId",
    "GroupRootId",
    "GroupNothingId",
    "GroupSecurityId",
    "GroupEverythingId",
    "GroupPrivateUserId",
    "GroupDriveUserId",
    "GroupSupervisorsId",
    "GroupViewOnlyId",
    "GroupDriverActivityId",
  ]);

  return allGroups
    .filter((g) => !systemIds.has(g.id))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function getDriverGroupNames(driver, groupMap) {
  if (!driver.companyGroups) return [];
  return driver.companyGroups
    .map((g) => groupMap[g.id]?.name)
    .filter(Boolean);
}

