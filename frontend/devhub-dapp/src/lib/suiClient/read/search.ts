import { Transaction } from '@mysten/sui/transactions';
import { suiClient } from '../constants';
import { PACKAGE_ID, DEVHUB_OBJECT_ID, CONTRACT_FUNCTIONS } from '../constants';
import { parseReturnValue } from '../utils';

export async function searchCardsBySkill(skillName: string, minProficiency: number) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SEARCH_CARDS_BY_SKILL}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(skillName),
            tx.pure.u8(minProficiency),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error searching cards by skill:', error);
    return [];
  }
}

export async function searchCardsByLocation(location: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SEARCH_CARDS_BY_LOCATION}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(location),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error searching cards by location:', error);
    return [];
  }
}

export async function searchCardsByWorkType(workType: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SEARCH_CARDS_BY_WORK_TYPE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(workType),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error searching cards by work type:', error);
    return [];
  }
}

export async function searchCardsByNiche(niche: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SEARCH_CARDS_BY_NICHE}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(niche),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error searching cards by niche:', error);
    return [];
  }
}

export async function searchProjectsBySkill(skill: string) {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.SEARCH_PROJECTS_BY_SKILL}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
            tx.pure.string(skill),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error searching projects by skill:', error);
    return [];
  }
}

export async function getAvailableDevelopers() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_AVAILABLE_DEVELOPERS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting available developers:', error);
    return [];
  }
}

export async function getOpenProjects() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_OPEN_PROJECTS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting open projects:', error);
    return [];
  }
}

// Niche-specific getters
export async function getUIUXDesigners() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_UI_UX_DESIGNERS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting UI/UX designers:', error);
    return [];
  }
}

export async function getContentCreators() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_CONTENT_CREATORS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting content creators:', error);
    return [];
  }
}

export async function getDevOpsProfessionals() {
  try {
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: (() => {
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::devhub::${CONTRACT_FUNCTIONS.GET_DEVOPS_PROFESSIONALS}`,
          arguments: [
            tx.object(DEVHUB_OBJECT_ID),
          ],
        });
        return tx;
      })(),
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    });

    if (result.results?.[0]?.returnValues) {
      return parseReturnValue(result.results[0].returnValues[0]) as number[];
    }
    return [];
  } catch (error) {
    console.error('Error getting DevOps professionals:', error);
    return [];
  }
}

