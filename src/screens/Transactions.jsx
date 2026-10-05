import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';


export default function Transactions(){
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/', { replace: true }); 
        }
    }, []);

    const [formData, setFormData] = useState({
        origin_account: '',
        destination_account: '',
        amount: '',
        currency: '',
        key: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setIsSubmitting(true);
        setError(null);
        
        const { key, ...bodyData } = formData;
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
        const rawBody = JSON.stringify(bodyData)
        const mensaje = `${timestamp}.${nonce}.${rawBody || ''}`;
        const hmac = CryptoJS.HmacSHA256(mensaje, key).toString(CryptoJS.enc.Hex);
        const token = localStorage.getItem('token'); 
        if (!token) {
            setError('No auth. Please, login.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/transactions', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'hmac': hmac,
            'timestamp': timestamp.toString(),
            'nonce': nonce,
            'authorization': `Bearer ${token}`,
            },
            body: rawBody
        });
        

        if (!response.ok) {
            throw new Error('Ocurrió un error al procesar la transferencia');
        }

        await response.text();
        alert('¡Transferencia realizada con éxito!');

        setFormData({
            origin_account: '',
            destination_account: '',
            amount: '',
            currency: '',
            key: ''
        });

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleLogout = async () => {
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        try {
            const response = await fetch('http://localhost:8080/api/v1/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`,
                },
                body: rawBody
            });

            if (response.ok || response.status === 401) {
                localStorage.removeItem('token'); //borra token navegador
                navigate('/');
            } else {
                setError('No se pudo cerrar la sesión');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor');
        }
    };

    return (<form onSubmit={handleSubmit}>
                <label>Origin Account:</label>
                <input
                type="text"
                name="origin_account"               
                value={formData.origin_account}     
                onChange={handleChange}         
                />

                <label>Destination Account:</label>
                <input
                type="text"
                name="destination_account"               
                value={formData.destination_account}     
                onChange={handleChange}         
                />

                <label>Amount:</label>
                <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                />

                <label>Currency:</label>
                <input
                type="text"
                name="currency"               
                value={formData.currency}     
                onChange={handleChange}         
                />

                <label>Key:</label>
                <input
                type="password"
                name="key"               
                value={formData.key}     
                onChange={handleChange}         
                />

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Send form'}
                </button>

                <button type="button" onClick={handleLogout}>
                    Logout
                </button>

            </form>);
}