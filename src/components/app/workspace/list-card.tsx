interface ListCardProps {
  listTitle: string
}
export function ListCard({ listTitle }: ListCardProps) {
  return (
    <div className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <a
        href="/dashboard/workspace/{workspaceList.member.workspaceId}/{workspaceList.list.id}"
        className="block"
      >
        <h2 className="mb-4 text-xl font-bold text-primary">{listTitle}</h2>
      </a>
      <div className="flex gap-2">
        {/* <UpdateListDialog
							listTitle={workspaceList.list.title}
							listID={workspaceList.list.id}
							{data}
						/>
						<DeleteListDialog
							listTitle={workspaceList.list.title}
							listID={workspaceList.list.id}
							{data}
						/> */}
      </div>
    </div>
  )
}
