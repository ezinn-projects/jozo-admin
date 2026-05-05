import { parseAsString, useQueryStates } from "nuqs";

export const useQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    from: parseAsString,
    to: parseAsString,
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
