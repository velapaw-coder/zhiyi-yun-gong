import NotFoundView from "../not-found";

export const metadata = { title: "没有这条记录" };

export default function MissingPage() {
  return <NotFoundView />;
}
