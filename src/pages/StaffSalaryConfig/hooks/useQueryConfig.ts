import { parseAsString, useQueryStates } from "nuqs";

export const useQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    keyword: parseAsString.withDefault(""),
    from: parseAsString,
    to: parseAsString,
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
