import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { categoriesData } from "../../static/data";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { toast } from "react-toastify";
import { createevent } from "../../redux/actions/event";

const CreateEvent = () => {
  const { seller } = useSelector((state) => state.seller);
  const { success, error } = useSelector((state) => state.event);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [images, setImages] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [originalPrice, setOriginalPrice] = useState();
  const [discountPrice, setDiscountPrice] = useState();
  const [stock, setStock] = useState();
  const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);



    const handleStartDateChange = (e) => {
        const startDate = new Date(e.target.value); 
        const minEndDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // Minimum end date is 3 days after start date
        setStartDate(startDate);
        setEndDate(null);
        document.getElementById("end-date").min = minEndDate.toISOString().slice(0, 10); // Set the minimum end date
    }
    const handleEndDateChange = (e) => {
           const endDate = new Date(e.target.value); 
           setEndDate(endDate);

    };

    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format 
    const minEndDate = startDate ? new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : today; // Minimum end date is 3 days after start date

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (success) {
      toast.success("Event created successfully!");
      navigate("/dashboard-events");
      window.location.reload()
    }
  }, [dispatch, error, success]);



  const handleSubmit = (e) => {
    e.preventDefault();

    const newForm = new FormData();
    images.forEach((image) => {
      newForm.append("images", image);
    });
    newForm.append("name", name);
    newForm.append("description", description);
    newForm.append("category", category);
    newForm.append("tags", tags);
    newForm.append("originalPrice", originalPrice);
    newForm.append("discountPrice", discountPrice);
    newForm.append("stock", stock);
    newForm.append("shopId", seller._id);
    newForm.append("Start_Date", startDate.toISOString());
    newForm.append("Finish_Date", endDate.toISOString());
    dispatch(createevent(newForm));
  };

  const handleImageChange = (e) => {
    e.preventDefault();

    let files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  return (
    <div className="w-[90%] 800px:w-[50%] shadow p-3 overflow-y-scroll h-[115vh] rounded-[4px] bg-white ">
      <h5 className="text-[30px] font-Poppins text-center ">Create Event</h5>
      {/* create event form */}
      <form onSubmit={handleSubmit}>
        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event Product name ..."
          />
        </div>
        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Description <span className="text-red-500">*</span>
          </label>
           <textarea
    cols="30"
    rows="8"
    required
    name="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="mt-2 block w-full appearance-none px-3 border pt-2 border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    placeholder="Enter your event product description"
></textarea>

        </div>
        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full mt-2 border h-[35px] rounded-[5px]"
            id=""
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Choose a category"> Choose a category</option>
            {categoriesData &&
              categoriesData.map((i) => (
                <option value={i.title} key={i.title}>
                  {i.title}
                </option>
              ))}
          </select>
        </div>

        <br />

        <div className="">
          <label htmlFor="" className="pb-2 ">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event product tags ..."
          />
        </div>

        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Original Price
          </label>
          <input
            type="number"
            name="price"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event product price ..."
          />
        </div>

        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Price (With Discount) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event product price with discount ..."
          />
        </div>
        <br />
        <div className="">
          <label htmlFor="" className="pb-2 ">
            Product Stock <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event stock..."
          />
        </div>
        <br />
         <div className="">
          <label htmlFor="" className="pb-2 ">
            Event Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="price"
            value={startDate ? startDate.toISOString().slice(0, 10) : ""}
            id="start-date"
            onChange={handleStartDateChange}
            min={today}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event stock..."
          />
        </div>
          <br />
         <div className="">
          <label htmlFor="" className="pb-2 ">
            Event End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="price"
            value={endDate ? endDate.toISOString().slice(0, 10) : ""}
            id="end-date"
            onChange={handleEndDateChange}
            min={minEndDate}
            className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter Your event stock..."
          />
        </div>
        <br />

        <div className="">
          <label htmlFor="" className="pb-2 ">
            Upload Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="upload"
            className="hidden"
            multiple
            onChange={handleImageChange}
          />
          <div className="w-full flex items-center flex-wrap">
            <label htmlFor="upload">
              <AiOutlinePlusCircle size={30} className="mt-3 " color="#555" />
            </label>
            {images &&
              images.map((i) => (
                <img
                  src={URL.createObjectURL(i)}
                  alt=""
                  key={i}
                  className="object-cover m-2 h-[120px] w-[120px] "
                />
              ))}
          </div>
          <br />
          <div>
            <input
              type="submit"
              value="Create"
              className="mt-2 block w-full appearance-none px-3 h-[35px] border border-gray-300 rounded-[3px] placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
