export const err400 = (err, req, res, next) => {
  if (err.status === 400) {
    res.status(400).send({ message: err.errors || "Bad Request!" });
  } else {
    next(err);
  }
};

export const err401 = (err, req, res, next) => {
  if (err.status === 401) {
    res.status(401).send({ message: err.errors || "Unauthorized!" });
  } else {
    next(err);
  }
};

export const err403 = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ message: err.errors || "Forbidden!" });
  } else {
    next(err);
  }
};

export const err404 = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(err.status).send({ message: err.message || "Not found!" });
  } else {
    next(err);
  }
};

export const err500 = (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ message: "Generic Server Error!" });
};
