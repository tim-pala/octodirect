import { repos as repoMock } from './mock.service';
import axios from 'axios';

import {
  getUserInfoToLocalStorage,
  UserInfoInterface,
} from './user-info.service';

export interface RepositoryInfo {
  id: string;
  name: string;
  url: string;
}

export const fetchGitHubRepository = async (): Promise<RepositoryInfo[]> => {
  if (process.env.NODE_ENV === 'development') {
    return repoMock;
  }
  const info = getUserInfoToLocalStorage();

  if (!info) {
    return [];
  }

  const name = (info as UserInfoInterface).name;
  const token = (info as UserInfoInterface).token;

  const query = `query {
    user(login: ${name}) {
      repositories(last: 100) {
        edges {
          node {
            id
            name
            url
          }
        }
      }
      starredRepositories(last: 100) {
        edges {
          node {
            id
            name
            url
          }
        }
      }
    }
  }`;

  try {
    const response = await axios
    .post('https://api.github.com/graphql', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
    const userInfo = response.data.user;
    const userRepositories = userInfo.repositories.edges.map(
      ({ node }: { node: RepositoryInfo }) => node,
    );
    const starredRepositories = userInfo.starredRepositories.edges.map(
      ({ node }: { node: RepositoryInfo }) => node,
    );

    return userRepositories.concat(starredRepositories);
  } catch (e) {
    console.error(e);
    return [];
  }
};
