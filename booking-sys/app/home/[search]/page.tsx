import React from "react"

type Props = {
	params: { search: string }
}

export default function Page({ params }: Props) {
	const { search } = params || { search: "" }
	return (
		<div>
			<h1>Search</h1>
			<p>Query: {search}</p>
		</div>
	)
}
