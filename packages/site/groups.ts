// groups.ts

export const groups: Record<string, string[]> = {
  "Manager": [
    "0x972e3819bEa4e1E102c2092E8736b0FEA49fB83D", // Manager 1
    "0x8c2620fF48e761e1FcD014dbB96D7bf81c97D4a0", // Manager 2
  ],
  "Dev": [
    "0x4892310c68f0c594F0814355747DdD02a1D2A58f", // Dev 1
    "0xA84dF0Ebf2F9A4151a52F5837f27a9611B9b8004", // Dev 2
    "0x690f7589f71D7A274aa9dDaf9741D17cDdC413C8", // Dev 3
    "0x609a3b6458Aba348878420B3557851f280E1e64b", // Dev 4
    "0x14e850AA838F6D9F19BC6e29E9ce0185D68af2Cb", // Dev 5
  ],
  "Mar": [
    "0xC7FA98f6d04B59008AB69B01E767FE0f2A792C2A", // Mar 1
    "0x0D66f6fc4d2499f15E28c9ebC1786A9F8AceE3a2", // Mar 2
    "0x7C2A7C77ea066bDBc191F390F93D0f9D6e8FBfEa", // Mar 3
    "0x297bFaFB4F718d6DD44d44046A82fA0CE6e7eFf5", // Mar 4
    "0xb715fa893DAB97107BA73df5706913bF246d744D", // Mar 5
    "0x877164Fa6fc582A2fe381712db8394eA8C4dB853", // Mar 6
    "0xCf93064A866b3E5C1A44B9Bea3A243d70569BB04", // Mar 7
  ],
};

// Helper function để lấy tất cả users
export const getAllUsers = (): string[] => {
  const allUsers = new Set<string>();
  Object.values(groups).forEach(group => {
    group.forEach(user => allUsers.add(user));
  });
  return Array.from(allUsers);
};

// Helper function để lấy group name từ user address
export const getGroupByUser = (userAddress: string): string | null => {
  for (const [groupName, users] of Object.entries(groups)) {
    if (users.includes(userAddress)) {
      return groupName;
    }
  }
  return null;
};

// Helper function để lấy mã nhân viên từ address
export const getEmployeeCode = (userAddress: string): string => {
  const employeeMap: Record<string, string> = {
    // Manager Team (2 người)
    "0x972e3819bEa4e1E102c2092E8736b0FEA49fB83D": "MGR1",
    "0x8c2620fF48e761e1FcD014dbB96D7bf81c97D4a0": "MGR2",
    
    // Dev Team (5 người)
    "0x4892310c68f0c594F0814355747DdD02a1D2A58f": "DEV1",
    "0xA84dF0Ebf2F9A4151a52F5837f27a9611B9b8004": "DEV2",
    "0x690f7589f71D7A274aa9dDaf9741D17cDdC413C8": "DEV3",
    "0x609a3b6458Aba348878420B3557851f280E1e64b": "DEV4",
    "0x14e850AA838F6D9F19BC6e29E9ce0185D68af2Cb": "DEV5",
    
    // Mar Team (7 người)
    "0xC7FA98f6d04B59008AB69B01E767FE0f2A792C2A": "MAR1",
    "0x0D66f6fc4d2499f15E28c9ebC1786A9F8AceE3a2": "MAR2",
    "0x7C2A7C77ea066bDBc191F390F93D0f9D6e8FBfEa": "MAR3",
    "0x297bFaFB4F718d6DD44d44046A82fA0CE6e7eFf5": "MAR4",
    "0xb715fa893DAB97107BA73df5706913bF246d744D": "MAR5",
    "0x877164Fa6fc582A2fe381712db8394eA8C4dB853": "MAR6",
    "0xCf93064A866b3E5C1A44B9Bea3A243d70569BB04": "MAR7",
  };
  
  return employeeMap[userAddress] || "Unknown";
};
