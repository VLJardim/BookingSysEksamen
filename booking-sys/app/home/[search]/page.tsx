"use client"

import React, { useEffect, useState } from "react"

type Props = {
	params: { search: string }
}

type Slot = { booking_id: string; starts_at: string; ends_at?: string }
type Facility = { facility_id: string; title: string; capacity?: string; description?: string; slots: Slot[] }

export default function Page({ params }: Props) {
	const search = params?.search || ""
	const [loading, setLoading] = useState(false)
	const [facilities, setFacilities] = useState<Facility[] | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!search) return
		let mounted = true
		setLoading(true)
		setError(null)
		fetch(`/api/search?date=${encodeURIComponent(search)}`)
			.then((res) => res.json())
			.then((data) => {
				if (!mounted) return
				if (data?.error) {
					setError(String(data.error))
					setFacilities([])
				} else {
					setFacilities(data)
				}
			})
			.catch((err) => {
				if (!mounted) return
				setError(String(err))
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [search])

	return (
		<div>
			<h1>Search</h1>
			<p>Query date: {search}</p>

			{loading && <p>Loading available facilities...</p>}

			{error && <p style={{ color: "red" }}>Error: {error}</p>}

			{!loading && facilities && facilities.length === 0 && <p>No available facilities found for this date.</p>}

			<div>
				{facilities?.map((f) => (
					<div key={f.facility_id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8 }}>
						<h2>{f.title}</h2>
						{f.capacity && <p>Capacity: {f.capacity}</p>}
						{f.description && <p>{f.description}</p>}
						<h4>Available slots</h4>
						<ul>
							{f.slots.map((s) => (
								<li key={s.booking_id}>
									{new Date(s.starts_at).toLocaleString()} - {s.ends_at ? new Date(s.ends_at).toLocaleTimeString() : ""}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
	)
}
