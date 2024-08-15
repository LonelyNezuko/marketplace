import React from "react";

import './index.scss'
import CategoryDTO from "@dto/category.dto";
import { API } from "@modules/API";
import { notify } from "@modules/Notify";
import { Language } from "@modules/Language";
import PhoneHeaderTitle from "@components/phoneHeaderTitle";
import Button from "@components/button";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link } from "react-router-dom";
import { categoryGenerateLink } from "@modules/functions/categoryGenerateLink";
import { formatImage } from "@modules/functions/formatImage";

export default function RouteCategoryPhone() {
    const [ loader, setLoader ] = React.useState(true)

    const [ categories, setCategories ] = React.useState<Array<CategoryDTO>>([])
    const [ categorySelect, setCategorySelect ] = React.useState(-1)

    React.useMemo(() => {
        setLoader(true)
        API({
            url: '/defaultapi/category/all',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setCategories(result.message)
                setLoader(false)
            }
            else notify("(categoryPhone) /category/all: " + result.message, { debug: true })
        })
    }, [])

    if(!window.isPhone)return
    return (
        <div className="route" id="routeCategoryPhone">
            <div className="routeHeader">
                <PhoneHeaderTitle text={Language("CATEGORIES")} />
            </div>

            <div className="routeBody">
                {categorySelect === -1 ? (<CategoryMain categories={categories} setCategorySelect={setCategorySelect} />) : ''}
                {categorySelect !== -1 ? (<CategorySubs category={categories[categorySelect]} setCategorySelect={setCategorySelect} />) : ''}
            </div>
        </div>
    )
}


function CategorySubs({ category, setCategorySelect }:
{ category: CategoryDTO, setCategorySelect: React.Dispatch<React.SetStateAction<number>> }) {
    if(!category)return
    return (
        <div className="listSubcategories">
            <div className="listSubcategoriesHeader">
                <Button name={Language("BACK")} icon={(<IoMdArrowRoundBack />)} type={"fill"} size={"big"} onClick={() => setCategorySelect(-1)} />
                <CategoryElem category={category} itMainLink={true} />
            </div>

            <div className="list">
                {category.categorySubcategories.length ? category.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                    return (
                        <CategoryElem category={cat} key={i} />
                    )
                }) : ''}
            </div>
        </div>
    )
}
function CategoryMain({ categories, setCategorySelect }:
{ categories: Array<CategoryDTO>, setCategorySelect: React.Dispatch<React.SetStateAction<number>> }) {
    if(!categories.length)return
    return (
        <div className="listMain">
            {categories.map((cat: CategoryDTO, i: number) => {
                return (<CategoryElem category={cat} key={i} onClick={() => setCategorySelect(i)} />)
            })}
        </div>
    )
}


interface CategoryElemProps {
    category: CategoryDTO,

    itMainLink?: boolean,

    onClick?: () => void
}
function CategoryElem({
    category,

    itMainLink,

    onClick
}: CategoryElemProps) {
    if(!category)return

    function Body() {
        function Header() {
            return (
                <>
                    <div className="categoryElemBackground">
                        <img src={category.categoryIcon} alt={category.categoryNameTranslate[window.language] || category.categoryName} />
                    </div>
                    <div className="categoryElemTitle">
                        <h6>{category.categoryNameTranslate[window.language] || category.categoryName}</h6>
                        {itMainLink ? (<span>{Language("MOBILE_CATEGORIES_ACTION_NAME_GOCATEGORY")}</span>)
                            : category.categoryParent
                            ? (<span>{category.productsCount} {Language("ADS")}</span>)
                            : (<span>{category.categorySubcategories.length} {Language("CATEGORIES_LIST").toLowerCase()}</span>)}
                    </div>
                </>
            )
        }

        return (
            <>
                {category.categoryParent ? (
                    <Link to={categoryGenerateLink(category)} className="categoryElemHeader">
                        <Header />
                    </Link>
                ) : (
                    <div className="categoryElemHeader">
                        <Header />
                    </div>
                )}

                {category.categoryParent && category.categorySubcategories && category.categorySubcategories.length ? (
                    <div className="categoryElemSubs">
                        {category.categorySubcategories.map((cat: CategoryDTO, i: number) => {
                            return (
                                <Link to={categoryGenerateLink(cat)} className="categoryElemSubsElem" key={i}>
                                    <h6>
                                        {cat.categoryIcon !== '/assets/category/default.png' ? (
                                            <img src={formatImage(cat.categoryIcon, 45)} alt={cat.categoryNameTranslate[window.language] || cat.categoryName} />
                                        ) : ''}
                                        {cat.categoryNameTranslate[window.language] || cat.categoryName}
                                    </h6>
                                    <span>{cat.productsCount} {Language("ADS")}</span>
                                </Link>
                            )
                        })}
                    </div>
                ) : ''}
            </>
        )
    }

    if(itMainLink)return (
        <Link to={categoryGenerateLink(category)} className="elem categoryElem">
            <Body />
        </Link>
    )
    return (
        <div className="elem categoryElem" onClick={() => {
            if(onClick) onClick()
        }}>
            <Body />
        </div>
    )
}