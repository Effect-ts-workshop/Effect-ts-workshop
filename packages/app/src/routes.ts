import { index, rootRoute, route } from "@tanstack/virtual-file-routes"

export const routes = rootRoute("root.tsx", [
  index("index.tsx"),
  route("items_/$id", "itemDetail/ItemDetail.tsx"),
  route("items", "itemsList/ItemsList.tsx", [
    route("$id/edit", "itemUpsert/ItemEdit.tsx"),
    route("$id/remove", "itemRemove/ItemRemove.tsx"),
    route("create", "itemUpsert/ItemCreate.tsx")
  ])
])
