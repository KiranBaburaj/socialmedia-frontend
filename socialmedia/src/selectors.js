// selectors.js
import { createSelector } from 'reselect';

const selectUsers = state => state.user.users;
const selectLoggedInUserId = state => state.auth.userId;

export const selectFilteredUsers = createSelector(
  [selectUsers, selectLoggedInUserId],
  (users, loggedInUserId) => users.filter(user => user.id !== loggedInUserId)
);

const selectState = state => state;

export const selectDerivedData = createSelector(
  [selectState],
  (state) => {
    const derivedData = { /* derive data from state */ };
    return derivedData;
  }
);