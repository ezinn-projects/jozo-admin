import { parseAsString, useQueryStates } from "nuqs";

export const useQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    keyword: parseAsString.withDefault(""),
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
