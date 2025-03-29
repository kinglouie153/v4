
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

const mockItems = [
  { sku: "123456", description: "Product A", price: 10 },
  { sku: "234567", description: "Product B", price: 20 },
];

export default function QuoteBuilder({ onBack }) {
  const [items, setItems] = useState(mockItems);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const itemFileRef = useRef();
  const customerFileRef = useRef();

  const filteredItems = items.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToQuote = (item) => {
    const existing = quoteItems.find((i) => i.sku === item.sku);
    if (existing) {
      setQuoteItems(
        quoteItems.map((i) =>
          i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setQuoteItems([...quoteItems, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (sku, qty) => {
    setQuoteItems(
      quoteItems.map((i) => (i.sku === sku ? { ...i, qty } : i))
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GVWS Sales Quote", 14, 22);
    doc.setFontSize(12);
    doc.text(`Customer: ${customerName}`, 14, 32);

    const rows = quoteItems.map((item) => [
      item.sku,
      item.description,
      item.qty,
      `$${item.price.toFixed(2)}`,
      `$${(item.qty * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 40,
      head: [["SKU", "Description", "Qty", "Unit Price", "Total"]],
      body: rows,
    });

    const total = quoteItems.reduce((sum, i) => sum + i.qty * i.price, 0);
    doc.text(`Total: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save("gvws-quote.pdf");
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: ({ data }) => {
        if (type === "items") {
          setItems(data.map(r => ({
            sku: r.sku,
            description: r.description,
            price: parseFloat(r.price)
          })));
        } else {
          alert("Customers upload coming soon.");
        }
      }
    });
  };

  const total = quoteItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-sm text-blue-600 underline">← Back</button>
        <h2 className="text-xl font-semibold">Create New Quote</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className="border p-2 rounded" />
        <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className="border p-2 rounded" />
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search items..."
        className="border px-4 py-2 w-full mb-4 rounded"
      />
      <div className="overflow-y-auto max-h-64 mb-4">
        <table className="w-full text-sm">
          <thead><tr><th>SKU</th><th>Desc</th><th>Price</th></tr></thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.sku} className="hover:bg-green-50 cursor-pointer" onClick={() => addToQuote(item)}>
                <td className="p-1">{item.sku}</td>
                <td className="p-1">{item.description}</td>
                <td className="p-1">${item.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-2">Quote Summary</h2>
      <table className="w-full text-sm mb-4">
        <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          {quoteItems.map(i => (
            <tr key={i.sku}>
              <td>{i.description}</td>
              <td>
                <input
                  type="number"
                  value={i.qty}
                  onChange={(e) => updateQty(i.sku, parseInt(e.target.value))}
                  className="w-12 border"
                />
              </td>
              <td>${(i.qty * i.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center">
        <strong>Total: ${total.toFixed(2)}</strong>
        <button onClick={generatePDF} className="bg-green-600 text-white px-4 py-2 rounded">Download PDF</button>
      </div>
    </div>
  );
}
