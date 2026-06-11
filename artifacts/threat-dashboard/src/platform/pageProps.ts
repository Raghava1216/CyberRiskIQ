export interface CurrentUserInfo {
  logInId: string;
  privileges: string[];
}

export interface PageProps {
  year: number;
  currentUserInfo: CurrentUserInfo;
  refreshCharts: boolean;
}
