import Navbar from "../components/Navbar"

export default function Journals() {
    const journals = [
        { id: 1, title: "Journal 1", content:"Content of journal"},
        { id: 2, title: "Journal 2:", content:"Content of journal 2"},
        { id: 3, title: "Journal 3", content:"Content of journal 3"},
        { id: 4, title: "Journal 4", content:"Content of journal 4"},
        { id: 5, title: "Journal 5", content: "Content of journal 5"},
    ]
    return(
    <>
    <Navbar />
        <div>
            <div>
                <h1 className="text-3xl mt-3">All Journals</h1>
            </div>
            <div className="">
                {journals.map((journal) => (
                    <div key={journal.id} className="border p-4 my-2 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">{journal.id}</h2>
                        <h3 className="text-lg">{journal.title}</h3>
                        <p>{journal.content}</p>
                    </div>
                ))}
            </div>
            
        </div>
    </>
    );
}