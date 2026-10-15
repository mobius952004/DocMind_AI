import { createContext , useState , useContext , useEffect,useCallback} from "react"
import { API_BASE } from "../api";
import { useAuth } from "../context/AuthContext";

const MockContext= createContext();

export  function MockContextProvider({children}){

    const{sessionId}=useAuth();


    const[mockMessage,setMockMessage]= useState([])


    const [isLoading, setIsLoading] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);


    useEffect(()=>{
        if(sessionId){
            localStorage.setItem(`docmind_mock_messages_${sessionId}`,
            JSON.stringify(mockMessage))
        }
    },[mockMessage,sessionId])


 const handleRemoveFile = useCallback((indexToRemove) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }, []);


const handleSend= useCallback(
    async ({ text, files }) => {
      if (!text.trim() && (!files || files.length === 0)) return;

      // Add attached files to drawer list
      if (files && files.length > 0) {
        const fileItems = files.map((f) => ({
          name: f.name,
          size: f.size,
          rawFile: f,
        }));
        setUploadedFiles((prev) => [...prev, ...fileItems]);

        // Automatically upload attached PDFs to backend /upload
        for (const fileObj of files) {
          if (fileObj.name.toLowerCase().endsWith('.pdf')) {
            const formData = new FormData();
            formData.append('file', fileObj);
            try {
              await fetch(`${API_BASE}/upload/`, {
                method: 'POST',
                body: formData,
              });
            } catch (err) {
              console.error('File upload error:', err);
            }
          }
        }
      }

        const userMessage={
            id:Date.now().toString(),
            role:'user',
            content:text,
            timestamp:new Date().toLocaleTimeString([],{
                hour:'2-digit',
                minute:'2-digit',
            })
        }

        setMockMessage((prev)=> [...prev,userMessage])
        setIsLoading(true)

        try {

            const response = await fetch(`${API_BASE}/interview/mock`,{
                method:'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'X-Session-ID':sessionId||'',
                },
                body:JSON.stringify({
                    topic:text,
                    session_id:sessionId||null,
                })
            })

            const data= await response.json()

            if(data.score){
                setLastFeedback({
                    score:data.score,
                    feedback:data.feedback,
                    mistakes:data.mistakes||[],
                    next_action:data.next_action,
                })
                
            }
            const assistantMessage={
                id:Date.now().toString(),
                role:'assistant',
                content:data.questions || data.result || 'No question generated.',
                timestamp:new Date().toLocaleTimeString([],{
                    hour:'2-digit',
                    minute:'2-digit',
                })
            }
            setMockMessage((prev)=> [...prev,assistantMessage])

            
        } catch (error) {
            console.error('Mock Interview API Error:',error)
            const errorMessage={
                id:Date.now().toString(),
                role:'assistant',
                content:'Failed to connect to the interview server. Please try again.',
                timestamp:new Date().toLocaleTimeString([],{
                    hour:'2-digit',
                    minute:'2-digit',
                })
            }
            setMockMessage((prev)=>[...prev,errorMessage])
        }finally{
            setIsLoading(false)
        }
    },
    [sessionId]
)
const clearMockchat=useCallback(()=>{
    setMockMessage([]);
    setLastFeedback(null)
    setIsLoading(false)

    localStorage.removeItem(`docmind_mock_messages_${sessionId}`)
},[sessionId])


  const handlePromptClick = useCallback(
    (promptText) => {
      handleSend({ text: promptText, files: [] });
    },
    [handleSend]
  );

return (
    <MockContext.Provider
    value={{
        mockMessage,
        setMockMessage,
        isLoading,
        lastFeedback,
        setLastFeedback,
        handleSend,
        clearMockchat,  
        handleRemoveFile, 
        handlePromptClick,
    }}
    >
        {children}
    </MockContext.Provider>

)
}

export function useMock(){
    const context = useContext(MockContext)
    if(!context){
        throw new Error(`useMock must be used withoin a MockProvider`)
    }

    return context
}
