// "should test that post /users/register endpoint is OK"
export const jamesBond = {
  first_name: "James",
  last_name: "Bond",
  username: "007",
  email: "jamesbond@mail.com",
  password: "shakennotstirred",
};

// "should test that post /users/session endpoint returns 401 if bad credentials"
export const badBondLogin = {
  email: "jamesbond@mail.com",
  password: "password",
};

// "should test that post /users/register admin endpoint is OK"
export const missMoneypenny = {
  first_name: "Jane",
  last_name: "Moneypenny",
  username: "missmoneypenny",
  email: "missmoneypenny@mail.com",
  password: "littleblackbook",
  admin: true,
};

// "should test that post /users/session endpoint returns 401 if bad credentials"
export const jasonBourne = {
  first_name: "Jason",
  last_name: "Bourne",
  username: "jasonbourne",
  email: "jasonbourne@mail.com",
  password: "whatsmyidentity",
};
export const jasonBourneLogin = {
  email: "jasonbourne@mail.com",
  password: "whatsmyidentity",
};

// "should test that post /users admin endpoint returns 409 if email duplicate"
export const felixLeiter = {
  first_name: "Felix",
  last_name: "Leiter",
  username: "felixleiter",
  email: "felixleiter@mail.com",
  password: "luckyfelix",
  admin: true,
};
export const jackRyan = {
  first_name: "Jack",
  last_name: "Ryan",
  username: "jackryan",
  email: "jackryan@mail.com",
  password: "jackryan",
};

// "should test that post /users admin endpoint returns 409 if email duplicate"
export const vesperLynd = {
  first_name: "Vesper",
  last_name: "Lynd",
  username: "vesperlynd",
  email: "vesperlynd@mail.com",
  password: "iamnotacar",
  admin: true,
};

// "should test that post /users/request/id endpoint returns 409 if user requests own ID"
export const goldfinger = {
  first_name: "Auric",
  last_name: "Goldfinger",
  username: "goldfinger",
  email: "goldfinger@mail.com",
  password: "1964",
};

// "should test that post /users/reject/id endpoint is OK and that it returns 409 if ID already rejected"
export const doctorNo = {
  first_name: "Doctor",
  last_name: "No",
  username: "drno",
  email: "drno@mail.com",
  password: "1962",
};
export const goldeneye = {
  first_name: "Alec",
  last_name: "Trevelyan",
  username: "trevelyan",
  email: "trevelyan@mail.com",
  password: "1995t ",
};

// "should test that post /users/accept/id endpoint is OK and that it returns 409 if ID already accepted"
export const xenia = {
  first_name: "Xenia",
  last_name: "Onatopp",
  username: "onatopp",
  email: "onatopp@mail.com",
  password: "henchwoman",
};
export const jaws = {
  first_name: "?",
  last_name: "?",
  username: "jaws",
  email: "jaws@mail.com",
  password: "moonraker",
};

// "should test that post /users/request/:id endpoint is OK and that it returns 409 if duplicated"
export const joeBloggs = {
  first_name: "Joe",
  last_name: "Bloggs",
  username: "joebloggs",
  email: "joebloggs@mail.com",
  password: "password",
};
export const janeDoe = {
  first_name: "Jane",
  last_name: "Doe",
  username: "janedoe",
  email: "janedoe@mail.com",
  password: "password",
};

// "should test that post /users/request/id endpoint returns 404 if user not found"
export const janeBloggs = {
  first_name: "Jan",
  last_name: "Bloggs",
  username: "janebloggs",
  email: "janebloggs@mail.com",
  password: "password",
};

// "should test that post /users/request/id endpoint returns 401 if bad credentials"
export const johnDoe = {
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  email: "johndoe@mail.com",
  password: "password",
};
