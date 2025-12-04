import { useCallback } from "react";
import type { Project, ProjectApplication } from "../lib/suiClient";
import { getProjectInfo as getProjectInfoFromClient, getProjectApplications as getProjectApplicationsFromClient } from "../lib/suiClient";
import type { ContractCacheRef } from "./useContractCache";
import { isCacheValid, setCacheEntry } from "./useContractUtils";

export const useContractProjects = (
  cacheRef: React.MutableRefObject<ContractCacheRef>,
  withRetry: <T>(operation: () => Promise<T>) => Promise<T>,
) => {
  const getProjectInfo = useCallback(
    async (projectId: number, forceRefresh: boolean = false): Promise<Project | null> => {
      const cached = cacheRef.current.projects.get(projectId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const project = await withRetry(async () => {
          return await getProjectInfoFromClient(projectId);
        });

        if (project) {
          cacheRef.current.projects.set(projectId, setCacheEntry(project));
        }
        return project;
      } catch (err) {
        console.error(`Error getting project info for ID ${projectId}:`, err);
        return null;
      }
    },
    [cacheRef, withRetry],
  );

  const getProjectApplications = useCallback(
    async (projectId: number, forceRefresh: boolean = false): Promise<ProjectApplication[]> => {
      const cached = cacheRef.current.projectApplications.get(projectId) || null;

      if (!forceRefresh && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const applications = await withRetry(async () => {
          return await getProjectApplicationsFromClient(projectId);
        });

        cacheRef.current.projectApplications.set(projectId, setCacheEntry(applications));
        return applications;
      } catch (err) {
        console.error(`Error getting project applications for ID ${projectId}:`, err);
        return [];
      }
    },
    [cacheRef, withRetry],
  );

  return {
    getProjectInfo,
    getProjectApplications,
  };
};

