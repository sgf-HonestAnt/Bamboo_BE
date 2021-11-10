import { refreshTokens } from "../auth/tools";

const REFRESH = async (req, res, next, _id) => {
  try {
    console.log("💠 REFRESH SESSION");
    const findUser = await UserModel.findById(_id);
    const actualRefreshToken = findUser.refreshToken
    // send refreshToken to detectReuse func
    const { accessToken, refreshToken } = await refreshTokens(
      actualRefreshToken
    );
    console.log("💠 REFRESHED TOKENS");
    return({ accessToken, refreshToken });
  } catch (e) {
    return(e);
  }
};

export default REFRESH;