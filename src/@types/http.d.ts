type ErrorField = {
  location: "body" | "query" | "params";
  msg: string;
  path: string;
  type: "field" | "global";
  value: string | number | boolean;
};

type HTTPResponse<T = unknown> = {
  result?: T;
  message: string;
  errors?: Record<keyof T, ErrorField>;
};
