import { parseAsString, useQueryStates } from "nuqs";

export const useGamesQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    tab: parseAsString.withDefault("types"),
    typeKeyword: parseAsString.withDefault(""),
    typeIsActive: parseAsString.withDefault("all"),
    gameKeyword: parseAsString.withDefault(""),
    gameIsActive: parseAsString.withDefault("all"),
    gameTypeId: parseAsString.withDefault("all"),
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
