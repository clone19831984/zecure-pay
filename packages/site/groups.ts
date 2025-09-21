// groups.ts

export const groups: Record<string, string[]> = {
  "Development Team": [
    "0x972e3819bEa4e1E102c2092E8736b0FEA49fB83D", // Dev1
    "0x8c2620fF48e761e1FcD014dbB96D7bf81c97D4a0", // Dev2
    "0x4892310c68f0c594F0814355747DdD02a1D2A58f", // Dev3
    "0xA84dF0Ebf2F9A4151a52F5837f27a9611B9b8004", // Dev4
    "0x690f7589f71D7A274aa9dDaf9741D17cDdC413C8", // Dev5
    "0x609a3b6458Aba348878420B3557851f280E1e64b", // Dev6
    "0x14e850AA838F6D9F19BC6e29E9ce0185D68af2Cb", // Dev7
  ],
  "Marketing Team": [
    "0xC7FA98f6d04B59008AB69B01E767FE0f2A792C2A", // Mar1
    "0x0D66f6fc4d2499f15E28c9ebC1786A9F8AceE3a2", // Mar2
    "0x7C2A7C77ea066bDBc191F390F93D0f9D6e8FBfEa", // Mar3
    "0x297bFaFB4F718d6DD44d44046A82fA0CE6e7eFf5", // Mar4
    "0xb715fa893DAB97107BA73df5706913bF246d744D", // Mar5
  ],
  "Management": [
    "0x877164Fa6fc582A2fe381712db8394eA8C4dB853", // Manager1
    "0xCf93064A866b3E5C1A44B9Bea3A243d70569BB04", // Manager2
    "0xE906Fe16f73706523B938d65cE71e5cb1e6D597C", // Manager3
  ],
  "Support Team": [
    "0x5084C7c47232767D5fe308736f2fF8D6e81ADF88", // Sup1
    "0x0A3E11f3Dd353feFDAA60026C2FD48C16BC31E97", // Sup2
    "0xbE6bcB2A8B91067A5168359053583EFE61b04B2D", // Sup3
  ],
  "QA Team": [
    "0x0C8142680c6a93587d5C84E191d32e955B58c89D", // QA1
    "0x4e6b6914fEF2f6B99F0A72f7b43ceF5c1Cd81947", // QA2
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
    // Development Team
    "0x972e3819bEa4e1E102c2092E8736b0FEA49fB83D": "DEV1",
    "0x8c2620fF48e761e1FcD014dbB96D7bf81c97D4a0": "DEV2",
    "0x4892310c68f0c594F0814355747DdD02a1D2A58f": "DEV3",
    "0xA84dF0Ebf2F9A4151a52F5837f27a9611B9b8004": "DEV4",
    "0x690f7589f71D7A274aa9dDaf9741D17cDdC413C8": "DEV5",
    "0x609a3b6458Aba348878420B3557851f280E1e64b": "DEV6",
    "0x14e850AA838F6D9F19BC6e29E9ce0185D68af2Cb": "DEV7",
    
    // Marketing Team
    "0xC7FA98f6d04B59008AB69B01E767FE0f2A792C2A": "Marketing1",
    "0x0D66f6fc4d2499f15E28c9ebC1786A9F8AceE3a2": "Marketing2",
    "0x7C2A7C77ea066bDBc191F390F93D0f9D6e8FBfEa": "Marketing3",
    "0x297bFaFB4F718d6DD44d44046A82fA0CE6e7eFf5": "Marketing4",
    "0xb715fa893DAB97107BA73df5706913bF246d744D": "Marketing5",
    
    // Management
    "0x877164Fa6fc582A2fe381712db8394eA8C4dB853": "Manager1",
    "0xCf93064A866b3E5C1A44B9Bea3A243d70569BB04": "Manager2",
    "0xE906Fe16f73706523B938d65cE71e5cb1e6D597C": "Manager3",
    
    // Support Team
    "0x5084C7c47232767D5fe308736f2fF8D6e81ADF88": "Support1",
    "0x0A3E11f3Dd353feFDAA60026C2FD48C16BC31E97": "Support2",
    "0xbE6bcB2A8B91067A5168359053583EFE61b04B2D": "Support3",
    
    // QA Team
    "0x0C8142680c6a93587d5C84E191d32e955B58c89D": "QA1",
    "0x4e6b6914fEF2f6B99F0A72f7b43ceF5c1Cd81947": "QA2",
  };
  
  return employeeMap[userAddress] || "Unknown";
};
