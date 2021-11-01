// unsplash
// Photos by Michael Dziedzic [https://unsplash.com/@lazycreekimages] on Unsplash
// Photo by Maria R O [https://unsplash.com/@mariarui?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText] on Unsplash
// cloudinary
const squarecrop = "w_500,ar_1:1,c_fill,g_face";
const scalew800 = "w_800,ar_16:9,c_fill,g_auto,e_sharpen";
const cloud = "https://res.cloudinary.com/dowvu52wz/image/upload";
const FARM = "v1635752952/schrutefarms";
export const MY_FOLDER = "my-task-app";
// users
export const NEW_BIO = "Newbie!";
export const USER_IMG = "default_avatar_rnmt6a.jpg";
export const USER_CROP_IMG = `${cloud}/${squarecrop}`;
export const DEFAULT_USER_IMG = `${USER_CROP_IMG}/${FARM}/${USER_IMG}`;
// tasks
export const SOLO = "solo";
export const TEAM = "team";
export const TASK_TYPES = [SOLO, TEAM];
export const AWAITED = "awaited";
export const TASK_STATUS_TYPES = ["awaited", "completed", "in_progress"];
export const NEVER = "never";
export const DAILY = "daily";
export const WEEKLY = "weekly";
export const BIMONTHLY = "bimonthly";
export const MONTHLY = "monthly";
export const NUMBER = `+${!NaN}`;
export const TASK_REPEAT_TYPES = [
  NEVER,
  DAILY,
  WEEKLY,
  BIMONTHLY,
  MONTHLY,
  NUMBER,
];
export const TASK_IMG = "default_task_nv0jcq.jpg";
export const TASK_RESIZE_IMG = `${cloud}/${scalew800}`;
export const DEFAULT_TASK_IMG = `${TASK_RESIZE_IMG}/${FARM}/${TASK_IMG}`;
// challenges
export const CHALL_IMG = `${cloud}/${scalew800}/${FARM}/default_task_nv0jcq.jpg`;
// settings
export const LIGHT_MODE = "light-mode";
export const DARK_MODE = "dark-mode";
export const THEMES = [LIGHT_MODE, DARK_MODE];

export const NONE = "none";

// /features tests
export const newFeature = {
  month: "January",
  descrip: "Here's the featured challenge of the month!",
  level: 1,
  value: 50,
};
// "should test that post /features admin endpoint is OK"
export const bryanMills = {
  first_name: "Bryan",
  last_name: "Mills",
  username: "bryanmills",
  email: "bryanmills@mail.com",
  password: "iwillfindyou",
  admin: true,
};
// "should test that put /features admin endpoint returns updated"
export const aliciaHuberman = {
  first_name: "Alicia",
  last_name: "Huberman",
  username: "alicia",
  email: "alicia@mail.com",
  password: "notorious",
  admin: true,
};
// "should test that delete /features admin endpoint is OK"
export const ethanHunt = {
  first_name: "Ethan",
  last_name: "Hunt",
  username: "ethanhunt",
  email: "ethanhunt@mail.com",
  password: "selfdestruct",
  admin: true,
};

// users tests
// "should test that post /users/register endpoint is OK"
export const jamesBond = {
  first_name: "James",
  last_name: "Bond",
  username: "007",
  email: "jamesbond@mail.com",
  password: "shakennotstirred",
};
export const jamesBondLogin = {
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
export const auricGoldfinger = {
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
export const alecTrevelyan = {
  first_name: "Alec",
  last_name: "Trevelyan",
  username: "trevelyan",
  email: "trevelyan@mail.com",
  password: "1995t ",
};
// "should test that post /users/accept/id endpoint is OK and that it returns 409 if ID already accepted"
export const xeniaOnatopp = {
  first_name: "Xenia",
  last_name: "Onatopp",
  username: "onatopp",
  email: "onatopp@mail.com",
  password: "henchwoman",
};
export const jaws = {
  first_name: "Zbigniew",
  last_name: "Krycsiwiki",
  username: "jaws",
  email: "jaws@mail.com",
  password: "moonraker",
};
// "should test that post /users/request/:id endpoint is OK and that it returns 409 if duplicated"
export const austinPowers = {
  first_name: "Austin",
  last_name: "Powers",
  username: "austinpowers",
  email: "austinpowers@mail.com",
  password: "shaggadelic",
};
export const nikitaMears = {
  first_name: "Nikita",
  last_name: "Mears",
  username: "nikita",
  email: "nikita@mail.com",
  password: "lafemme",
};
// "should test that post /users/request/id endpoint returns 404 if user not found"
export const natashaRomanova = {
  first_name: "Natasha",
  last_name: "Romanova",
  username: "natasha",
  email: "natasha@mail.com",
  password: "s.h.i.e.l.d.",
};
// "should test that post /users/request/id endpoint returns 401 if bad credentials"
export const johnWick = {
  first_name: "John",
  last_name: "Wick",
  username: "johnwick",
  email: "johnwick@mail.com",
  password: "mydog",
};
