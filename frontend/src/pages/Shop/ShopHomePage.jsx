import React from 'react'
import styles from '../../styles/style'
import ShopInfo from "../../components/shop/ShopInfo"
import ShopProfileData from "../../components/shop/ShopProfileData"

const ShopHomePage = () => {
  return (
    <div className={`${styles.section} bg-[#f5f5f5]`}>
            <div className="w-full flex py-10  justify-between">
              <div className="w-[25%] bg-[#fff] shadow-sm sticky left-0 z-10 rounded-[4px]  overflow-y-scroll h-[90vh] top-10 ">
                <ShopInfo isOwner={true} />
              </div>
              <div className="w-[72%] rounded-[4px]">
                <ShopProfileData isOwner={true} />
              </div>
            </div>
    </div>
  )
}

export default ShopHomePage
