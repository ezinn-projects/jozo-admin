import dayjs from "@/lib/dayjs";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const todayVn = () => dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

export const useFnbShiftCountQueryConfig = () => {
  const [queryConfig, setQueryConfig] = useQueryStates({
    tab: parseAsString.withDefault("entry"),
    date: parseAsString.withDefault(todayVn()),
    search: parseAsString.withDefault(""),
    historyFrom: parseAsString.withDefault(""),
    historyTo: parseAsString.withDefault(""),
    historyPage: parseAsInteger.withDefault(1),
    historyLimit: parseAsInteger.withDefault(20),
  });

  return {
    queryConfig,
    setQueryConfig,
  };
};
